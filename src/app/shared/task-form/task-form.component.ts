import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task, TaskPayload, TaskState } from '../../core/models/task.model';

@Component({
  selector: 'app-task-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
})
export class TaskFormComponent implements OnInit, OnChanges {
  @Input() states: TaskState[] = [];
  @Input() initialTask: Task | null = null;
  @Input() submitLabel = 'Save task';

  @Output() readonly formSubmit = new EventEmitter<TaskPayload>();
  @Output() readonly cancel = new EventEmitter<void>();

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    dueDate: ['', Validators.required],
    currentState: ['', Validators.required],
    notes: this.formBuilder.array([]),
  });

  ngOnInit(): void {
    this.initializeNotes();
    this.patchForm(this.initialTask);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialTask'] && !changes['initialTask'].firstChange) {
      this.patchForm(this.initialTask);
    }

    if (changes['states'] && !this.initialTask && !this.form.controls.currentState.value && this.states.length > 0) {
      this.form.patchValue({ currentState: this.states[0]?.name ?? '' });
    }
  }

  get notes(): FormArray {
    return this.form.get('notes') as FormArray;
  }

  addNote(value = ''): void {
    const validators = this.notes.length === 0 ? [Validators.required] : [];
    this.notes.push(this.formBuilder.control(value, validators));
  }

  removeNote(index: number): void {
    if (this.notes.length === 1) {
      this.notes.at(0).reset('');
      this.notes.at(0).markAsTouched();
      return;
    }

    this.notes.removeAt(index);
    this.reapplyFirstNoteValidator();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const notes = (rawValue.notes ?? [])
      .map((note) => String(note ?? '').trim())
      .filter((note) => note.length > 0);

    this.formSubmit.emit({
      title: rawValue.title!.trim(),
      description: rawValue.description!.trim(),
      dueDate: rawValue.dueDate!,
      currentState: rawValue.currentState!,
      completed: this.states.some(
        (state) => state.name === rawValue.currentState && Boolean(state.isCompletionState),
      ),
      notes,
    });
  }

  trackByIndex(index: number): number {
    return index;
  }

  private initializeNotes(): void {
    if (this.notes.length === 0) {
      this.addNote();
    }
  }

  private patchForm(task: Task | null): void {
    this.notes.clear();

    const taskNotes = task?.notes.length ? task.notes : [''];
    taskNotes.forEach((note, index) => {
      const validators = index === 0 ? [Validators.required] : [];
      this.notes.push(this.formBuilder.control(note, validators));
    });

    this.form.patchValue({
      title: task?.title ?? '',
      description: task?.description ?? '',
      dueDate: task?.dueDate ?? '',
      currentState: task?.stateHistory.at(-1)?.state ?? this.states.at(0)?.name ?? '',
    });

    this.reapplyFirstNoteValidator();
  }

  private reapplyFirstNoteValidator(): void {
    this.notes.controls.forEach((control, index) => {
      control.clearValidators();
      if (index === 0) {
        control.addValidators(Validators.required);
      }
      control.updateValueAndValidity({ emitEvent: false });
    });
  }
}
