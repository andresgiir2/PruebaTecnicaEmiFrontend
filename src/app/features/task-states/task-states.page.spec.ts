import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import TaskStatesPage from './task-states.page';
import { TaskApiService } from '../../core/services/task-api.service';

describe('TaskStatesPage', () => {
  let component: TaskStatesPage;
  let fixture: ComponentFixture<TaskStatesPage>;

  const taskApiServiceStub = {
    states$: of([{ name: 'new', isCompletionState: false, usageCount: 1, activeTaskCount: 1 }]),
    loading$: of(false),
    error$: of(null),
    ensureLoaded: jasmine.createSpy('ensureLoaded'),
    clearError: jasmine.createSpy('clearError'),
    createState: jasmine.createSpy('createState').and.returnValue(of({ name: 'blocked', isCompletionState: false })),
    renameState: jasmine.createSpy('renameState').and.returnValue(of({ name: 'renamed', isCompletionState: false })),
    deleteState: jasmine.createSpy('deleteState').and.returnValue(of(void 0)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskStatesPage],
      providers: [provideRouter([]), { provide: TaskApiService, useValue: taskApiServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskStatesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call createState with trimmed value', () => {
    component.createForm.patchValue({ name: '  blocked  ' });
    component.createState();

    expect(taskApiServiceStub.createState).toHaveBeenCalledWith({ name: 'blocked', isCompletionState: false });
  });
});
