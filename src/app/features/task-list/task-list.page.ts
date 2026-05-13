import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { TaskApiService } from '../../core/services/task-api.service';
import { TaskCardComponent } from '../../shared/task-card/task-card.component';

@Component({
  selector: 'app-task-list-page',
  imports: [CommonModule, RouterLink, TaskCardComponent],
  templateUrl: './task-list.page.html',
  styleUrl: './task-list.page.scss',
})
export default class TaskListPage {
  readonly taskService = inject(TaskApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly currentPageSubject = new BehaviorSubject<number>(1);

  readonly pageSize = 5;

  readonly tasks$ = this.taskService.tasks$;
  readonly loading$ = this.taskService.loading$;
  readonly error$ = this.taskService.error$;
  readonly success$ = this.taskService.success$;
  readonly currentPage$ = combineLatest([this.tasks$, this.currentPageSubject.asObservable()]).pipe(
    map(([tasks, requestedPage]) => {
      const maxPage = Math.max(1, Math.ceil(tasks.length / this.pageSize));
      return Math.min(requestedPage, maxPage);
    }),
  );
  readonly paginatedTasks$ = combineLatest([this.tasks$, this.currentPage$]).pipe(
    map(([tasks, effectivePage]) => {
      const start = (effectivePage - 1) * this.pageSize;
      return tasks.slice(start, start + this.pageSize);
    }),
  );
  readonly totalPages$ = this.tasks$.pipe(map((tasks) => Math.max(1, Math.ceil(tasks.length / this.pageSize))));
  readonly pageNumbers$ = this.totalPages$.pipe(map((totalPages) => Array.from({ length: totalPages }, (_, index) => index + 1)));

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.taskService.ensureLoaded();
    }
  }

  setPage(page: number): void {
    this.currentPageSubject.next(page);
  }

  goToPreviousPage(currentPage: number): void {
    if (currentPage > 1) {
      this.setPage(currentPage - 1);
    }
  }

  goToNextPage(currentPage: number, totalPages: number): void {
    if (currentPage < totalPages) {
      this.setPage(currentPage + 1);
    }
  }

  onDelete(taskId: string): void {
    if (!confirm('Delete this task?')) {
      return;
    }

    this.taskService.deleteTask(taskId).subscribe();
  }

  onComplete(taskId: string): void {
    this.taskService.markCompleted(taskId).subscribe();
  }

  trackByPage(_: number, page: number): number {
    return page;
  }
}
