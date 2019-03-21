import {Pipe, PipeTransform, SecurityContext} from '@angular/core';
import { DomSanitizer} from '@angular/platform-browser';

@Pipe({
    name: 'safe'
})
export class SafePipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {}
    transform(url: string, sanitizeSource: boolean): any {
        return this.sanitizer.bypassSecurityTrustResourceUrl(
          sanitizeSource ? this.sanitizer.sanitize(SecurityContext.URL, url) : url
        );
    }
}
