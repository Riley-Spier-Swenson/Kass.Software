/*! instant.page v1.1.0 - (C) 2019 Alexandre Dieulot - https://instant.page/license */
/*! instant.page v1.1.0m1 - (C) 2019 Kyle Spier-Swenson - https://instant.page/license - Modified for /tg/station 13, used here under license*/

let urlToPreload
let mouseoverTimer
let lastTouchTimestamp

const prefetcher = document.createElement('link')
const isSupported = prefetcher.relList && prefetcher.relList.supports && prefetcher.relList.supports('prefetch')
const prerenderer = document.createElement('link')
const isPrerendererSupported = prefetcher.relList && prefetcher.relList.supports && prefetcher.relList.supports('prerender')
const allowQueryString = 'instantAllowQueryString' in document.body.dataset

if (isSupported) {
	prefetcher.rel = 'prefetch'
	document.head.appendChild(prefetcher)

	const eventListenersOptions = {
		capture: true,
		passive: true,
	}
	document.addEventListener('touchstart', touchstartListener, eventListenersOptions)
	document.addEventListener('mouseover', mouseoverListener, eventListenersOptions)
}
if (isPrerendererSupported) {
	prerender.rel = 'prerender'
	document.head.appendChild(prerenderer)

	const eventListenersOptions = {
		capture: true,
		passive: true,
	}
	document.addEventListener('mousedown', mousedownListener, eventListenersOptions)
}


function touchstartListener(event) {
	/* Chrome on Android calls mouseover before touchcancel so `lastTouchTimestamp`
	 * must be assigned on touchstart to be measured on mouseover. */
	lastTouchTimestamp = performance.now()

	const linkElement = event.target.closest('a')

	if (!linkElement) {
		return
	}

	if (!isPreloadable(linkElement)) {
		return
	}

	linkElement.addEventListener('touchcancel', touchendAndTouchcancelListener, {passive: true})
	linkElement.addEventListener('touchend', touchendAndTouchcancelListener, {passive: true})

	urlToPreload = linkElement.href
		if (isPrerendererSupported) {
			prerender(linkElement.href)
		} else {
			preload(linkElement.href)
		}
}

function touchendAndTouchcancelListener() {
	urlToPreload = undefined
	stopPreloading()
		if (isPrerendererSupported) {
			stopPrerendering()
		} else {
			stopPreloading()
		}
}

function mouseoverListener(event) {
	if (performance.now() - lastTouchTimestamp < 1100) {
		return
	}

	const linkElement = event.target.closest('a')

	if (!linkElement) {
		return
	}

	if (!isPreloadable(linkElement)) {
		return
	}

	linkElement.addEventListener('mouseout', mouseoutListener, {passive: true})

	urlToPreload = linkElement.href

	mouseoverTimer = setTimeout(() => {
		preload(linkElement.href)
		mouseoverTimer = undefined
	}, 100)
}

function mousedownListener(event) {
	if (performance.now() - lastTouchTimestamp < 1100) {
		return
	}

	const linkElement = event.target.closest('a')

	if (!linkElement) {
		return
	}

	if (!isPreloadable(linkElement)) {
		return
	}

	linkElement.addEventListener('mouseout', mouseoutListener, {passive: true})

	urlToPreload = linkElement.href

	prerender(linkElement.href)
}

function mouseoutListener(event) {
	if (event.relatedTarget && event.target.closest('a') == event.relatedTarget.closest('a')) {
		return
	}

	if (mouseoverTimer) {
		clearTimeout(mouseoverTimer)
		mouseoverTimer = undefined
	}
	else {
		urlToPreload = undefined
		stopPreloading()
		stopPrerendering()
	}
}

function isPreloadable(linkElement) {
	if (urlToPreload == linkElement.href) {
		return
	}

	const urlObject = new URL(linkElement.href)

	if (urlObject.origin != location.origin) {
		return
	}

	if (!allowQueryString && urlObject.search && !('instant' in linkElement.dataset)) {
		return
	}

	if (urlObject.hash && urlObject.pathname + urlObject.search == location.pathname + location.search) {
		return
	}

	if ('noInstant' in linkElement.dataset) {
		return
	}

	return true
}

function preload(url) {
	prefetcher.href = url
}
function prerender(url) {
	prerenderer.href = url
}

function stopPreloading() {
	/* The spec says an empty string should abort the prefetching
	* but Firefox 64 interprets it as a relative URL to prefetch. */
	prefetcher.removeAttribute('href')
}

function stopPrerendering() {
	/* The spec says an empty string should abort the prefetching
	* but Firefox 64 interprets it as a relative URL to prefetch. */
	prerenderer.removeAttribute('href')
}