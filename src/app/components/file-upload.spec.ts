import { TestBed } from '@angular/core/testing';
import { FileUpload } from './file-upload';

describe('FileUpload', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUpload],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(FileUpload);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render a file input and the call to action', async () => {
    const fixture = TestBed.createComponent(FileUpload);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('input[type="file"]')).toBeTruthy();
    expect(compiled.textContent).toContain('Choose files');
  });
});
