import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TaskState } from '../../core/models/task.model';
import { TaskApiService } from '../../core/services/task-api.service';

@Component({
  selector: 'app-task-states-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './task-states.page.html',
  styleUrl: './task-states.page.scss',
})
export default class TaskStatesPage {
  readonly taskService = inject(TaskApiService);
  private readonly formBuilder = inject(FormBuilder);

  readonly states$ = this.taskService.states$;
  readonly loading$ = this.taskService.loading$;
  readonly error$ = this.taskService.error$;

  readonly createForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(40)]],
    isCompletionState: [false],
  });

  readonly renameForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(40)]],
    isCompletionState: [false],
  });

  readonly deleteForm = this.formBuilder.group({
    replacementState: [''],
  });

  editingStateName: string | null = null;
  deletingStateName: string | null = null;

  constructor() {
    this.taskService.ensureLoaded();
  }

  createState(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const name = this.createForm.getRawValue().name?.trim() ?? '';
    const isCompletionState = Boolean(this.createForm.getRawValue().isCompletionState);
    this.taskService.createState({ name, isCompletionState }).subscribe(() => {
      this.createForm.reset();
    });
  }

  startRename(state: TaskState): void {
    this.editingStateName = state.name;
    this.renameForm.reset({ name: state.name, isCompletionState: Boolean(state.isCompletionState) });
  }

  cancelRename(): void {
    this.editingStateName = null;
    this.renameForm.reset();
  }

  saveRename(state: TaskState): void {
    if (this.renameForm.invalid) {
      this.renameForm.markAllAsTouched();
      return;
    }

    const nextName = this.renameForm.getRawValue().name?.trim() ?? '';
    this.taskService.renameState(state.name, nextName, Boolean(this.renameForm.getRawValue().isCompletionState)).subscribe(() => {
      this.cancelRename();
    });
  }

  startDelete(state: TaskState): void {
    this.deletingStateName = state.name;
    this.deleteForm.reset({ replacementState: '' });
  }

  cancelDelete(): void {
    this.deletingStateName = null;
    this.deleteForm.reset();
  }

  confirmDelete(state: TaskState): void {
    const payload =
      (state.usageCount ?? 0) > 0
        ? { replacementState: this.deleteForm.getRawValue().replacementState?.trim() || undefined }
        : {};

    this.taskService.deleteState(state.name, payload).subscribe(() => {
      this.cancelDelete();
    });
  }

  canDeleteWithoutReplacement(state: TaskState): boolean {
    return (state.usageCount ?? 0) === 0;
  }

  replacementOptions(states: TaskState[], currentStateName: string): TaskState[] {
    return states.filter((state) => state.name !== currentStateName);
  }
}
