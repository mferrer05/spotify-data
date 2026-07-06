import { Component } from '@angular/core';
import { FileUpload } from './components/file-upload';
import { StatsDashboard } from './components/stats-dashboard';

@Component({
  selector: 'app-root',
  imports: [FileUpload, StatsDashboard],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
/** Root component of the Spotify Data app. Hosts the file upload and stats dashboard sections. */
export class App {}
