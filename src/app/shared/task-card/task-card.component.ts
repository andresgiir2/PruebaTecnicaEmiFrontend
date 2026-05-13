import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Task } from '../../core/models/task.model';
import { TaskApiService } from '../../core/services/task-api.service';

@Component({
  selector: 'app-task-card',
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Input() showViewAction = true;
  @Input() showQuickActions = true;

  @Output() readonly deleteTask = new EventEmitter<string>();
  @Output() readonly completeTask = new EventEmitter<string>();

  private readonly taskService = inject(TaskApiService);

  get latestState(): string {
    return this.taskService.getLatestState(this.task);
  }

  get isCompleted(): boolean {
    return this.taskService.isTaskCompleted(this.task);
  }
}
