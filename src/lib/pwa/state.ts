import { writable } from 'svelte/store';

export interface PWAStatus {
	installPromptVisible: boolean;
	offline: boolean;
}

type InstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	preventDefault: () => void;
};

const initialStatus = (): PWAStatus => ({
	installPromptVisible: false,
	offline: typeof navigator !== 'undefined' ? !navigator.onLine : false
});

export function createPWAState() {
	const store = writable<PWAStatus>(initialStatus());
	let current = initialStatus();
	let deferredPrompt: InstallPromptEvent | null = null;
	let initialized = false;

	const setState = (updater: (prev: PWAStatus) => PWAStatus) => {
		current = updater(current);
		store.set(current);
	};

	const onBeforeInstallPrompt = (event: InstallPromptEvent) => {
		event.preventDefault();
		deferredPrompt = event;
		setState((prev) => ({ ...prev, installPromptVisible: true }));
	};

	const onOnline = () => setState((prev) => ({ ...prev, offline: false }));
	const onOffline = () => setState((prev) => ({ ...prev, offline: true }));

	const init = () => {
		if (initialized || typeof window === 'undefined') return;
		initialized = true;
		window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
		window.addEventListener('online', onOnline);
		window.addEventListener('offline', onOffline);
		// sync initial offline state
		setState((prev) => ({ ...prev, offline: typeof navigator !== 'undefined' ? !navigator.onLine : prev.offline }));
	};

	const acceptInstall = async () => {
		if (!deferredPrompt) return;
		const promptEvent = deferredPrompt;
		deferredPrompt = null;
		setState((prev) => ({ ...prev, installPromptVisible: false }));
		await promptEvent.prompt();
	};

	const dismissInstall = () => {
		deferredPrompt = null;
		setState((prev) => ({ ...prev, installPromptVisible: false }));
	};

	const destroy = () => {
		if (typeof window === 'undefined') return;
		window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
		window.removeEventListener('online', onOnline);
		window.removeEventListener('offline', onOffline);
	};

	store.subscribe((value) => {
		current = value;
	});

	return {
		init,
		acceptInstall,
		dismissInstall,
		destroy,
		get store() {
			return current;
		},
		subscribe: store.subscribe
	};
}

export type PWAState = ReturnType<typeof createPWAState>;

export const pwaState = createPWAState();
