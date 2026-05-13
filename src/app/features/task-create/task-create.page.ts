import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TaskPayload } from '../../core/models/task.model';
import { TaskApiService } from '../../core/services/task-api.service';
import { TaskFormComponent } from '../../shared/task-form/task-form.component';

@Component({
  selector: 'app-task-create-page',
  imports: [CommonModule, TaskFormComponent],
  templateUrl: './task-create.page.html',
  styleUrl: './task-create.page.scss',
})
export default class TaskCreatePage {
  readonly taskService = inject(TaskApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  readonly states$ = this.taskService.states$;
  readonly error$ = this.taskService.error$;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.taskService.ensureLoaded();
    }
  }

  createTask(payload: TaskPayload): void {
    this.taskService.createTask(payload).subscribe((task) => {
      this.router.navigate(['/tasks', task.id]);
    });
  }

  cancel(): void {
    this.router.navigate(['/tasks']);
  }
}
