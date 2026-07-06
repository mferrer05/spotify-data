import { TestBed } from '@angular/core/testing';
import { StatsDashboard } from './stats-dashboard';

describe('StatsDashboard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsDashboard],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(StatsDashboard);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the empty state until data is loaded', async () => {
    const fixture = TestBed.createComponent(StatsDashboard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No data yet');
  });
});
