import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NgMagicIframeModule } from '../../projects/ng-magic-iframe/src/lib/ng-magic-iframe.module';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ExemplifyModule } from 'angular-exemplify';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgMagicIframeModule,
    ReactiveFormsModule,
    NgbTooltipModule,
    ExemplifyModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
