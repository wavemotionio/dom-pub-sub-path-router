// dom-pub-sub-path-router
export const eventManager = {
	events: {},

	subscribe: (routerMethod, routerEvents) => {
		routerEvents.methods.forEach(method => {
			if (method.command && method.route) {

				if (!eventManager.events[routerEvents.module]) {
					eventManager.events[routerEvents.module] = {};
				}

				// EXPOSE SUBSCRIPTION SO IT IS AVAILABLE TO REMOVE
				eventManager.events[routerEvents.module][method.command] = {
					subscribe: () => {
						document.addEventListener(routerEvents.module + method.command, e => {
							const pathToRouteTo = method.route +'?'+ Object.keys(e.detail).map(key => key + '=' + e.detail[key]).join('&');

							routerMethod(pathToRouteTo);
						});
					}
				};

				// SUBSCRIBE: ADD GLOBAL LISTENER
				eventManager.events[routerEvents.module][method.command].subscribe();

				// EXPOSE PUBLISH METHOD SO IT IS AVAILABLE TO BE CALLED EXTERNALLY
				eventManager.events[routerEvents.module][method.command].publish = (params) => {
					document.dispatchEvent(new CustomEvent(routerEvents.module + method.command, { detail: params }));
				};
			}
		});
	},

	unsubscribe: (routerEvents) => {
		routerEvents.methods.forEach(method => {
			if (eventManager.events[routerEvents.module] && method.command && method.route) {
				// REMOVE GLOBAL LISTENER
				document.removeEventListener(routerEvents.module + method.command, eventManager.events[routerEvents.module][method.command].subscribe);
			}
		});
	}
};
