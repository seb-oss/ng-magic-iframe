import {ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {NgMagicIframeComponent} from '../../projects/ng-magic-iframe/src/lib/components/ng-magic-iframe.component';
import {IframeEvent} from '../../projects/ng-magic-iframe/src/lib/interfaces/iframe-event';
import {FormBuilder, FormGroup} from '@angular/forms';
import {takeUntil} from 'rxjs/operators';
import {Snippet} from 'angular-exemplify/lib/interfaces/snippet';
import {environment} from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    src = '/assets/first-page.html';
    activSrc = '/assets/first-page.html';
    styles = 'body { background: white; }';
    styleUrls: Array<string> = ['/assets/css/external-stylesheet.css', '/assets/css/fonts.css'];
    $events: BehaviorSubject<Array<IframeEvent>> = new BehaviorSubject<Array<IframeEvent>>([]);
    magicControlsForm: FormGroup;
    isActiveIframeTools = true;
    private $unsubscribe = new Subject();

    @ViewChild(NgMagicIframeComponent) private iframeComponent: NgMagicIframeComponent;
    sources: Array<Snippet> = [{
        name: 'Basic usage',
        src: '<seb-ng-magic-iframe [source]="\'/assets/first-page.html\'"></seb-ng-magic-iframe>',
        lang: 'markup'
    }, {
        name: 'Advanced usage',
        src: `<seb-ng-magic-iframe [source]="'/assets/first-page.html'"
                     [styles]="'body { background: white; }'"
                     [styleUrls]="['/assets/css/external-stylesheet.css', '/assets/css/fonts.css']"
                     [autoResize]="false"
                     [resizeDebounceMillis]="0"
                     (iframeEvent)="foo($event)">
                     <div class="skeleton-loader"></div>
</seb-ng-magic-iframe>`,
        lang: 'markup'
    }];
    constructor(private cdr: ChangeDetectorRef, private fb: FormBuilder) {}

    travis_build_number: string = environment.travis_build_number;
    version: string = (environment.version === '0.0.0-semantically-released' || environment.version === 'n/a')
        ? 'unreleased dev version' : environment.version;
    versionLink: string = (environment.version === '0.0.0-semantically-released' || environment.version === 'n/a')
        ? 'latest' : 'tag/v' + environment.version;
    public date: Date = new Date();

    public param = {
        year: this.date.getFullYear()
    };

    toggleSource() {
        this.src = this.src !== '/assets/first-page.html' ? '/assets/first-page.html' : '/assets/other-page.html';
    }

    reload() {
        this.iframeComponent.reload();
    }
    printEvent($event: IframeEvent) {
        const page = $event.src.split('/');
        const resourceName = $event.resource && typeof $event.resource !== 'object'
            ? $event.resource.split('/') : typeof $event.resource === 'object' ? 'all external stylesheets' : null;
        this.$events.next([{
            event: $event.event,
            src: page[page.length - 1],
            resource: resourceName && typeof $event.resource !== 'object' ? resourceName[resourceName.length - 1] : <string>resourceName},
            ...this.$events.value]);
        this.activSrc = $event.src;
        this.cdr.detectChanges();
    }
    clearLog() {
        this.$events.next([]);
    }

    toggleIframeTools() {
        this.isActiveIframeTools = !this.isActiveIframeTools;
    }

    ngOnInit() {
        this.magicControlsForm = this.fb.group({
           inlineStyles: true,
           externalStyles: true,
           autoResize: true,
           resizeDebounceMillis: 0
        });

        this.magicControlsForm.valueChanges
            .pipe(
                takeUntil(this.$unsubscribe)
            )
            .subscribe(val => {
                this.iframeComponent.reload();
                if (!val.autoResize && !this.magicControlsForm.get('resizeDebounceMillis').disabled) {
                    this.magicControlsForm.get('resizeDebounceMillis').disable({onlySelf: true});
                } else if (val.autoResize && this.magicControlsForm.get('resizeDebounceMillis').disabled) {
                    this.magicControlsForm.get('resizeDebounceMillis').enable({onlySelf: true});
                }
            });
    }

    ngOnDestroy() {
        this.$unsubscribe.next();
        this.$unsubscribe.complete();
    }
}
