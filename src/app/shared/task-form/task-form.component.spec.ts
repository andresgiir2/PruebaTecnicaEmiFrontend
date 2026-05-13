import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskFormComponent } from './task-form.component';

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    component.states = [{ name: 'new' }, { name: 'active' }];
    fixture.detectChanges();
  });

  it('should be invalid when required fields are missing', () => {
    component.submit();
    expect(component.form.invalid).toBeTrue();
  });

  it('should emit a valid payload', () => {
    spyOn(component.formSubmit, 'emit');

    component.form.patchValue({
      title: 'Prepare review',
      description: 'Create the release review package.',
      dueDate: '2026-05-12',
      currentState: 'new',
    });
    component.notes.at(0).setValue('First note');

    component.submit();

    expect(component.formSubmit.emit).toHaveBeenCalledWith({
      title: 'Prepare review',
      description: 'Create the release review package.',
      dueDate: '2026-05-12',
      currentState: 'new',
      completed: false,
      notes: ['First note'],
    });
  });
});
