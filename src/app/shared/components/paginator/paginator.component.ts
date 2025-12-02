import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, signal, input } from '@angular/core';

@Component({
  selector: 'app-paginator',
  imports: [CommonModule],
  templateUrl: './paginator.component.html',
  styleUrl: './paginator.component.scss'
})
export class PaginatorComponent {
  @Input() totalRecords = 0;
  @Input() rowsPerPageOptions: number[] = [10, 20, 50];
  @Input() showOptions = false;
  @Input() pageLinkSize = 3;
  @Input() pageSize: number = 10;

  @Output() pageChange = new EventEmitter<{ page: number; pageSize: number }>();

  currentPage = signal(1);
  // pageSize = input<number>(5);

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  get visiblePageLinks(): number[] {
    const total = this.totalPages;
    const half = Math.floor(this.pageLinkSize / 2);
    let start = Math.max(this.currentPage() - half, 1);
    let end = start + this.pageLinkSize - 1;

    if (end > total) {
      end = total;
      start = Math.max(end - this.pageLinkSize + 1, 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage.set(page);
      this.emitPageChange();
    }
  }

  changePageSize(size: any) {
    this.pageSize = size.target?.value;
    this.currentPage.set(1); // reset to first page
    this.emitPageChange();
  }

  emitPageChange() {
    this.pageChange.emit({ page: this.currentPage(), pageSize: this.pageSize });
  }

  get startItem(): number {
    return (this.currentPage() - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage() * this.pageSize, this.totalRecords);
  }
}
