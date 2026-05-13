import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, EMPTY, Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { CreateTaskStatePayload, DeleteTaskStatePayload, Task, TaskPayload, TaskState } from '../models/task.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  private readonly tasksSubject = new BehaviorSubject<Task[]>([]);
  private readonly statesSubject = new BehaviorSubject<TaskState[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly tasksLoadedSubject = new BehaviorSubject<boolean>(false);

  readonly tasks$ = this.tasksSubject.asObservable();
  readonly states$ = this.statesSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();
  readonly tasksLoaded$ = this.tasksLoadedSubject.asObservable();

  private hasLoadedTasks = false;
  private hasLoadedStates = false;

  ensureLoaded(): void {
    if (!this.hasLoadedStates) {
      this.loadStates();
    }

    if (!this.hasLoadedTasks) {
      this.loadTasks();
    }
  }

  loadTasks(): void {
    this.loadingSubject.next(true);
    this.http
      .get<Task[]>(`${this.apiBaseUrl}/tasks`)
      .pipe(
        tap((tasks) => {
          this.tasksSubject.next(tasks);
          this.hasLoadedTasks = true;
          this.tasksLoadedSubject.next(true);
          this.errorSubject.next(null);
        }),
        catchError((error) => this.failRequest('No fue posible cargar las tareas.', error)),
        finalize(() => this.loadingSubject.next(false)),
      )
      .subscribe();
  }

  loadStates(): void {
    this.loadingSubject.next(true);
    this.http
      .get<TaskState[]>(`${this.apiBaseUrl}/states`)
      .pipe(
        tap((states) => {
          this.statesSubject.next(states);
          this.hasLoadedStates = true;
          this.errorSubject.next(null);
        }),
        catchError((error) => this.failRequest('No fue posible cargar los estados.', error)),
        finalize(() => this.loadingSubject.next(false)),
      )
      .subscribe();
  }

  getTaskById(id: string): Observable<Task | undefined> {
    return this.tasks$.pipe(map((tasks) => tasks.find((task) => task.id === id)));
  }

  createTask(payload: TaskPayload): Observable<Task> {
    this.loadingSubject.next(true);
    return this.http.post<Task>(`${this.apiBaseUrl}/tasks`, payload).pipe(
      tap((task) => {
        this.tasksSubject.next([task, ...this.tasksSubject.value]);
        this.errorSubject.next(null);
      }),
      catchError((error) => this.failRequest('No fue posible crear la tarea.', error, true)),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  updateTask(id: string, payload: TaskPayload): Observable<Task> {
    this.loadingSubject.next(true);
    return this.http.put<Task>(`${this.apiBaseUrl}/tasks/${id}`, payload).pipe(
      tap((task) => {
        this.tasksSubject.next(
          this.tasksSubject.value.map((currentTask) => (currentTask.id === id ? task : currentTask)),
        );
        this.errorSubject.next(null);
      }),
      catchError((error) => this.failRequest('No fue posible actualizar la tarea.', error, true)),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  deleteTask(id: string): Observable<void> {
    this.loadingSubject.next(true);
    return this.http.delete<void>(`${this.apiBaseUrl}/tasks/${id}`).pipe(
      tap(() => {
        this.tasksSubject.next(this.tasksSubject.value.filter((task) => task.id !== id));
        this.errorSubject.next(null);
      }),
      catchError((error) => this.failRequest('No fue posible eliminar la tarea.', error, true)),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  markCompleted(id: string): Observable<Task> {
    this.loadingSubject.next(true);
    return this.http.patch<Task>(`${this.apiBaseUrl}/tasks/${id}/complete`, {}).pipe(
      tap((task) => {
        this.tasksSubject.next(
          this.tasksSubject.value.map((currentTask) => (currentTask.id === id ? task : currentTask)),
        );
        this.errorSubject.next(null);
      }),
      catchError((error) => this.failRequest('No fue posible marcar la tarea como completada.', error, true)),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  createState(payload: CreateTaskStatePayload): Observable<TaskState> {
    this.loadingSubject.next(true);
    return this.http.post<TaskState>(`${this.apiBaseUrl}/states`, payload).pipe(
      tap(() => {
        this.errorSubject.next(null);
        this.refreshStateData();
      }),
      catchError((error) => this.failRequest('No fue posible crear el estado.', error, true)),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  renameState(currentName: string, nextName: string, isCompletionState = false): Observable<TaskState> {
    this.loadingSubject.next(true);
    return this.http.put<TaskState>(`${this.apiBaseUrl}/states/${encodeURIComponent(currentName)}`, { name: nextName, isCompletionState }).pipe(
      tap(() => {
        this.errorSubject.next(null);
        this.refreshStateData();
      }),
      catchError((error) => this.failRequest('No fue posible renombrar el estado.', error, true)),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  deleteState(currentName: string, payload: DeleteTaskStatePayload = {}): Observable<void> {
    this.loadingSubject.next(true);
    return this.http.request<void>('delete', `${this.apiBaseUrl}/states/${encodeURIComponent(currentName)}`, { body: payload }).pipe(
      tap(() => {
        this.errorSubject.next(null);
        this.refreshStateData();
      }),
      catchError((error) => this.failRequest('No fue posible eliminar el estado.', error, true)),
      finalize(() => this.loadingSubject.next(false)),
    );
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  getLatestState(task: Task): string {
    return task.stateHistory.at(-1)?.state ?? 'unknown';
  }

  isTaskCompleted(task: Task): boolean {
    const latestState = this.getLatestState(task);
    const matchingState = this.statesSubject.value.find((state) => state.name === latestState);

    if (!matchingState) {
      return task.completed;
    }

    return Boolean(matchingState.isCompletionState);
  }

  private refreshStateData(): void {
    this.hasLoadedStates = false;
    this.hasLoadedTasks = false;
    this.loadStates();
    this.loadTasks();
  }

  private failRequest(message: string, error: unknown, rethrow = false): Observable<never> {
    console.error(message, error);
    this.errorSubject.next(message);

    if (rethrow) {
      return throwError(() => error);
    }

    return EMPTY;
  }
}
