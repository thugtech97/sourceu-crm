<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessContactImport;
use App\Models\ContactImportBatch;
use App\Models\ContactImportBatchRecord;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LeadImportController extends Controller
{
    public function index(): InertiaResponse
    {
        return Inertia::render('crm/leads/import/index', [
            'recentBatches' => ContactImportBatch::query()
                ->where('created_by', auth()->id())
                ->with('createdBy:id,name')
                ->latest()
                ->limit(5)
                ->get(['id', 'filename', 'original_filename', 'total_rows', 'successful_rows', 'failed_rows', 'status', 'completed_at', 'created_by']),
        ]);
    }

    public function upload(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,xlsx', 'max:10240'],
        ]);

        $file = $validated['file'];
        $extension = $file->getClientOriginalExtension();
        $originalFilename = $file->getClientOriginalName();

        // Read file to get headers and first few rows (from temp location)
        $data = $this->parseFile($file->getRealPath(), $extension);

        // Ensure imports directory exists
        File::makeDirectory(storage_path('app/imports'), 0755, true, true);

        // Store file
        $filename = 'lead-import-'.now()->timestamp.'-'.uniqid().'.'.$extension;
        $file->storeAs('imports', $filename, 'local');

        // Create import batch
        $batch = ContactImportBatch::create([
            'created_by' => auth()->id(),
            'filename' => $filename,
            'original_filename' => $originalFilename,
            'total_rows' => count($data['rows']),
            'status' => 'pending',
        ]);

        // Store file data in session for column mapping and confirm
        session(['import_lead_file_data' => [
            'batch_id' => $batch->id,
            'filename' => $filename,
            'original_filename' => $originalFilename,
            'headers' => $data['headers'],
            'rows' => $data['rows'],
            'sample_rows' => array_slice($data['rows'], 0, 5),
        ]]);

        return to_route('leads.import.mapping');
    }

    public function mapping(): InertiaResponse
    {
        $fileData = session('import_lead_file_data');
        if (! $fileData) {
            return redirect()->route('leads.import.index');
        }

        $defaultMappings = $this->getDefaultColumnMappings($fileData['headers']);

        return Inertia::render('crm/leads/import/mapping', [
            'batchId' => $fileData['batch_id'],
            'filename' => $fileData['original_filename'],
            'headers' => $fileData['headers'],
            'sampleRows' => $fileData['sample_rows'],
            'defaultMappings' => $defaultMappings,
            'availableFields' => [
                ['value' => 'first_name', 'label' => 'First Name *'],
                ['value' => 'last_name', 'label' => 'Last Name *'],
                ['value' => 'email', 'label' => 'Email'],
                ['value' => 'phone', 'label' => 'Phone'],
                ['value' => 'job_title', 'label' => 'Job Title'],
                ['value' => 'company_name', 'label' => 'Company Name'],
                ['value' => 'status', 'label' => 'Status'],
                ['value' => 'pool_team', 'label' => 'Pool Team'],
                ['value' => 'notes', 'label' => 'Notes'],
                ['value' => 'source_type', 'label' => 'Source Type'],
                ['value' => 'account_id', 'label' => 'Account ID'],
                ['value' => 'ignore', 'label' => '(Ignore)'],
            ],
        ]);
    }

    public function confirm(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'batch_id' => ['required', 'exists:contact_import_batches,id'],
            'mappings' => ['required', 'array'],
            'mappings.*' => ['nullable', 'string'],
        ]);

        $batch = ContactImportBatch::findOrFail($validated['batch_id']);

        // Only allow if user is the creator
        if ($batch->created_by !== auth()->id()) {
            abort(403);
        }

        if ($batch->status !== 'pending') {
            return back()->withErrors(['error' => 'Batch has already been processed.']);
        }

        $fileData = session('import_lead_file_data');
        if (! $fileData) {
            return back()->withErrors(['error' => 'Session data expired.']);
        }

        // Use parsed file data from session
        $data = $fileData;

        // Create records with mappings applied
        $mappings = $validated['mappings'];
        $rowNumber = 2; // Start from 2 as 1 is header

        foreach ($data['rows'] as $row) {
            $mappedData = [];
            foreach ($mappings as $columnIndex => $fieldName) {
                if ($fieldName && $fieldName !== 'ignore' && isset($row[$columnIndex])) {
                    $mappedData[$fieldName] = $row[$columnIndex];
                }
            }

            ContactImportBatchRecord::create([
                'batch_id' => $batch->id,
                'row_number' => $rowNumber,
                'status' => 'pending',
                'data' => $mappedData,
            ]);

            $rowNumber++;
        }

        // Dispatch job
        ProcessContactImport::dispatch($batch);

        session()->forget('import_lead_file_data');

        return to_route('leads.import.status', $batch->id);
    }

    public function status(ContactImportBatch $batch): InertiaResponse
    {
        // Only allow user to view their own batches
        if ($batch->created_by !== auth()->id()) {
            abort(403);
        }

        return Inertia::render('crm/leads/import/status', [
            'batch' => $batch->load('createdBy:id,name'),
        ]);
    }

    public function getStatus(ContactImportBatch $batch): array
    {
        if ($batch->created_by !== auth()->id()) {
            abort(403);
        }

        return [
            'id' => $batch->id,
            'status' => $batch->status,
            'total_rows' => $batch->total_rows,
            'processed_rows' => $batch->processed_rows,
            'successful_rows' => $batch->successful_rows,
            'failed_rows' => $batch->failed_rows,
            'progress_percentage' => $batch->progress_percentage,
            'started_at' => $batch->started_at?->toIso8601String(),
            'completed_at' => $batch->completed_at?->toIso8601String(),
        ];
    }

    public function downloadTemplate(): StreamedResponse
    {
        $filename = 'leads-import-template.csv';

        $headers = [
            'first_name',
            'last_name',
            'email',
            'phone',
            'job_title',
            'company_name',
            'status',
            'notes',
            'source_type',
            'pool_team',
        ];

        $sampleData = [
            ['John', 'Prospect', 'john@prospect.com', '+639171234567', 'Manager', 'Tech Corp', 'lead', 'Qualified lead', 'inbound', 'sales'],
            ['Jane', 'Lead', 'jane@prospect.com', '+639181234567', 'Owner', 'Innovation Inc', 'prospect', 'Warm contact', 'cold', 'cold_calling'],
        ];

        return response()->streamDownload(function () use ($headers, $sampleData) {
            $fp = fopen('php://output', 'w');
            fputcsv($fp, $headers);
            foreach ($sampleData as $row) {
                fputcsv($fp, $row);
            }
            fclose($fp);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function downloadExcelTemplate(): StreamedResponse
    {
        $filename = 'leads-import-template.xlsx';

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        $headers = [
            'first_name',
            'last_name',
            'email',
            'phone',
            'job_title',
            'company_name',
            'status',
            'notes',
            'source_type',
            'pool_team',
        ];

        // Add headers
        foreach ($headers as $index => $header) {
            $column = Coordinate::stringFromColumnIndex($index + 1);
            $sheet->setCellValue("{$column}1", $header);
        }

        // Add sample data
        $sampleData = [
            ['John', 'Prospect', 'john@prospect.com', '+639171234567', 'Manager', 'Tech Corp', 'lead', 'Qualified lead', 'inbound', 'sales'],
            ['Jane', 'Lead', 'jane@prospect.com', '+639181234567', 'Owner', 'Innovation Inc', 'prospect', 'Warm contact', 'cold', 'cold_calling'],
        ];

        foreach ($sampleData as $rowIndex => $row) {
            foreach ($row as $colIndex => $value) {
                $column = Coordinate::stringFromColumnIndex($colIndex + 1);
                $sheet->setCellValue("{$column}".($rowIndex + 2), $value);
            }
        }

        // Auto-size columns
        foreach ($headers as $index => $header) {
            $column = Coordinate::stringFromColumnIndex($index + 1);
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function downloadErrorLog(ContactImportBatch $batch)
    {
        if ($batch->created_by !== auth()->id()) {
            abort(403);
        }

        if (! $batch->error_log_path) {
            abort(404);
        }

        $filePath = storage_path('app/'.$batch->error_log_path);

        if (! file_exists($filePath)) {
            abort(404);
        }

        return response()->download(
            $filePath,
            'lead-import-errors-'.$batch->id.'.csv',
            [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="lead-import-errors-'.$batch->id.'.csv"',
            ]
        )->deleteFileAfterSend(false);
    }

    private function parseFile(string $filepath, string $extension): array
    {
        if ($extension === 'csv') {
            return $this->parseCSV($filepath);
        } elseif ($extension === 'xlsx') {
            return $this->parseExcel($filepath);
        }

        throw new \Exception('Unsupported file format.');
    }

    private function parseCSV(string $filepath): array
    {
        $rows = [];
        $headers = [];

        if (($handle = fopen($filepath, 'r')) !== false) {
            $isFirstRow = true;
            while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                if ($isFirstRow) {
                    $headers = array_map('trim', $data);
                    $isFirstRow = false;
                } else {
                    $rows[] = $data;
                }
            }
            fclose($handle);
        }

        return [
            'headers' => $headers,
            'rows' => $rows,
        ];
    }

    private function parseExcel(string $filepath): array
    {
        $spreadsheet = IOFactory::load($filepath);
        $sheet = $spreadsheet->getActiveSheet();
        $rows = [];
        $headers = [];

        foreach ($sheet->getRowIterator() as $rowIndex => $row) {
            $rowData = [];
            foreach ($row->getCellIterator() as $cell) {
                $rowData[] = $cell->getValue();
            }

            if ($rowIndex === 1) {
                $headers = array_map('trim', $rowData);
            } else {
                $rows[] = $rowData;
            }
        }

        return [
            'headers' => $headers,
            'rows' => $rows,
        ];
    }

    private function getDefaultColumnMappings(array $headers): array
    {
        $commonMappings = [
            'first name' => 'first_name',
            'firstname' => 'first_name',
            'first_name' => 'first_name',
            'last name' => 'last_name',
            'lastname' => 'last_name',
            'last_name' => 'last_name',
            'email' => 'email',
            'email address' => 'email',
            'phone' => 'phone',
            'phone number' => 'phone',
            'job title' => 'job_title',
            'title' => 'job_title',
            'status' => 'status',
            'notes' => 'notes',
            'source type' => 'source_type',
            'source' => 'source_type',
            'account id' => 'account_id',
            'account' => 'account_id',
        ];

        $mappings = [];
        foreach ($headers as $header) {
            $lowerHeader = strtolower($header);
            $mappings[] = $commonMappings[$lowerHeader] ?? null;
        }

        return $mappings;
    }
}
