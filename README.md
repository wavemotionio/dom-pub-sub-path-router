# dom-pub-sub-path-router

Browser DOM pub/sub manager for routing events by path between autonomous modules. Provided examples demonstrate use with [single-spa.js](https://github.com/CanopyTax/single-spa), or you can provide your own router function to `eventManager.subscribe(routerMethod, ...)`.

## routerEvents
Define and export events for a module based on the module's known internal routing.

`src/someModule/events.js`
```
export const events = {
	module: 'someModule',
	methods: [
		{
			command: 'open',
			route: '/someModule/lorem-ipsum'
		}
	]
};
```

## eventManager.subscribe(routerMethod, routerEvents)
Import `routerEvents` from a module and execute eventManager.subscribe()

`src/root-application/root-application.js`
```
// IMPORT MODULE'S EVENTS
import { events as someModuleEvents } from '../angularjs/events';
// IMPORT EVENT MANAGER
import { eventManager } from 'dom-pub-sub-path-router';

...

// SUBSCRIBE TO EVENTS
eventManager.subscribe(window.location, someModuleEvents);
```

## eventManager.events.<module>.<event>.publish
Import events that are being exposed by other modules and publish to them.

`src/anotherModule/anotherModule.component.ts`
```
import { Component } from '@angular/core';
import { eventManager } from 'dom-pub-sub-path-router';

@Component({
	selector: 'app2',
	template: `<button (click)="open($event)">open someModule from this module</button>`,
})

export class App2 {
   	open = () => {
		eventManager.events.someModule.open.publish({ someItemId: 5000 });
   	}
}
```

### Auto-unsubsribe with single-spa.js API
```
import * as singleSpa from 'single-spa';
import { events as someModuleEvents } from '../angularjs/events';
import { eventManager } from 'dom-pub-sub-path-router';
import _ from 'lodash';

const applicationModules = [
		{
			name: 'angularjs',
			dependencies: []
		},
		{
			name: 'app-2',
			dependencies: [someModuleEvents]
		}
	],
	application = {
		modules: applicationModules,
		allEvents: () => {
			const listOfEvents = [];

			application.modules.forEach((appModule) => {
				listOfEvents.concat(appModule);
			});

			return listOfEvents;
		}
	},
	pathPrefix = prefix => (location => (location.pathname.startsWith(`${prefix}`)));

singleSpa.registerApplication('app-1', () =>
	import ('../app1/app1.js'), pathPrefix('/app1'));
singleSpa.registerApplication('app-2', () =>
	import ('../app2/app2.js'), pathPrefix('/app2'));
singleSpa.registerApplication('angularjs', () =>
	import ('../angularjs/angularjs.app.js'), pathPrefix('/angularjs'));

singleSpa.start();

window.addEventListener('single-spa:app-change', evt => {
	const requiredDeps = [],
		mountedApps = singleSpa.getMountedApps();

	_.each(mountedApps, appModule => {
		const targetModule = _.find(application.modules, ['name', appModule]);

		if (targetModule && targetModule.dependencies.length > 0) {
			targetModule.dependencies.forEach(eventDependencies => {
				eventManager.subscribe(singleSpaNavigate, eventDependencies);
			});

			requiredDeps.concat(targetModule.dependencies);
		}
	});

	_.each(_.difference(application.allEvents(), requiredDeps), (unusedEvents) => {
		if (unusedEvents) {
			eventManager.unsubscribe(unusedEvents);
		}
	});
});
```
