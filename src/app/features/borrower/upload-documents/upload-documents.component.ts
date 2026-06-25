import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../../core/services/document.service';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoanDocumentResponse } from '../../../core/models/document.model';

interface DocSlot { key: string; label: string; file: File | null; uploading: boolean; }

@Component({
  selector: 'app-upload-documents',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Supporting Documents</h1>
      <p class="page-subtitle">Upload KYC and supporting documents for your application</p>
    </div>

    @if (!loanId()) {
      <div class="card text-center py-10 text-slate-500">No active loan found. Apply for a loan first.</div>
    } @else {
      <div class="max-w-3xl space-y-6">
        <!-- Upload slots -->
        <div class="grid sm:grid-cols-2 gap-4">
          @for (slot of slots; track slot.key) {
            <div class="card">
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{{ slot.label }}</p>
              <div class="drop-zone" (click)="fileInput.click()"
                   (dragover)="$event.preventDefault()" (drop)="onDrop($event, slot)">
                @if (slot.file) {
                  <p class="text-sm text-primary-700 font-medium">📎 {{ slot.file.name }}</p>
                  <p class="text-xs text-slate-400 mt-1">{{ fileSize(slot.file) }}</p>
                } @else {
                  <div class="text-slate-400">
                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    <p class="text-sm">Drop file or browse</p>
                  </div>
                }
                <input #fileInput type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png"
                       (change)="onFileSelect($event, slot)">
              </div>
              @if (slot.file) {
                <button class="btn-primary w-full mt-3 text-sm" [disabled]="slot.uploading"
                        (click)="upload(slot)">
                  @if (slot.uploading) { <span class="spinner w-4 h-4"></span> }
                  Upload {{ slot.label }}
                </button>
              }
            </div>
          }
        </div>

        <!-- Uploaded docs table -->
        @if (docs().length > 0) {
          <div class="card">
            <h2 class="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Uploaded Files</h2>
            <div class="table-wrapper">
              <table class="ts-table">
                <thead><tr>
                  <th>File</th><th>Type</th><th>Status</th>
                </tr></thead>
                <tbody>
                  @for (d of docs(); track d.id) {
                    <tr>
                      <td class="font-medium">{{ d.fileName }}</td>
                      <td>{{ d.docType }}</td>
                      <td>
                        <span [class]="d.status === 'VERIFIED' ? 'badge-green' : d.status === 'REJECTED' ? 'badge-red' : 'badge-amber'"
                              class="badge">{{ d.status }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class UploadDocumentsComponent implements OnInit {
  loanId = signal<number | null>(null);
  docs = signal<LoanDocumentResponse[]>([]);

  slots: DocSlot[] = [
    { key: 'AADHAAR',        label: 'Aadhaar',         file: null, uploading: false },
    { key: 'PAN',            label: 'PAN Card',         file: null, uploading: false },
    { key: 'BUSINESS_PROOF', label: 'Business Proof',   file: null, uploading: false },
    { key: 'BANK_STATEMENT', label: 'Bank Statement',   file: null, uploading: false },
  ];

  constructor(private docSvc: DocumentService, private loanSvc: LoanService, private auth: AuthService) {}

  ngOnInit() {
    const uid = this.auth.currentUser()?.id;
    if (!uid) return;
    this.loanSvc.getLoansByBorrower(uid).subscribe(res => {
      const loan = res.data?.[0];
      if (loan) {
        this.loanId.set(loan.loanId);
        this.docSvc.getByLoan(loan.loanId).subscribe(r => this.docs.set(r.data ?? []));
      }
    });
  }

  onFileSelect(event: Event, slot: DocSlot) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) slot.file = file;
  }

  onDrop(event: DragEvent, slot: DocSlot) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) slot.file = file;
  }

  upload(slot: DocSlot) {
    if (!slot.file || !this.loanId()) return;
    slot.uploading = true;
    this.docSvc.upload(this.loanId()!, slot.key, slot.file).subscribe({
      next: res => {
        this.docs.update(d => [...d, res.data]);
        slot.file = null;
        slot.uploading = false;
      },
      error: () => { slot.uploading = false; }
    });
  }

  fileSize(f: File) {
    const kb = f.size / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
  }
}
