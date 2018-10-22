import { NgModule } from '@angular/core';
import { NgMagicIframeComponent } from './components/ng-magic-iframe.component';
import { SafePipe } from './pipes/safe.pipe';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [CommonModule],
  declarations: [NgMagicIframeComponent, SafePipe],
  exports: [NgMagicIframeComponent]
})
export class NgMagicIframeModule { }
