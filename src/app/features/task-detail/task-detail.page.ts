import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { TaskPayload } from '../../core/models/task.model';
import { TaskApiService } from '../../core/services/task-api.service';
import { TaskCardComponent } from '../../shared/task-card/task-card.component';
import { TaskFormComponent } from '../../shared/task-form/task-form.component';

@Component({
  selector: 'app-task-detail-page',
  imports: [CommonModule, RouterLink, TaskCardComponent, TaskFormComponent],
  templateUrl: './task-detail.page.html',
  styleUrl: './task-detail.page.scss',
})
export default class TaskDetailPage {
  readonly taskService = inject(TaskApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly taskId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly task$ = this.taskService.getTaskById(this.taskId);
  readonly states$ = this.taskService.states$;
  readonly error$ = this.taskService.error$;
  readonly success$ = this.taskService.success$;
  readonly tasksLoaded$ = this.taskService.tasksLoaded$;
  readonly viewModel$ = combineLatest([this.task$, this.states$, this.tasksLoaded$]).pipe(
    map(([task, states, tasksLoaded]) => ({ task, states, tasksLoaded })),
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.taskService.ensureLoaded();
    }
  }

  updateTask(payload: TaskPayload): void {
    this.taskService.updateTask(this.taskId, payload).subscribe();
  }

  deleteTask(): void {
    if (!confirm('Delete this task?')) {
      return;
    }

    this.taskService.deleteTask(this.taskId).subscribe(() => {
      this.router.navigate(['/tasks']);
    });
  }

  completeTask(): void {
    this.taskService.markCompleted(this.taskId).subscribe();
  }

  goBack(): void {
    this.router.navigate(['/tasks']);
  }
}
