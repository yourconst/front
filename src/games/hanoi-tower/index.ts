import '../../app.css'
import App from './App.svelte'

document.addEventListener('touchmove', function (event) {
  if (event['scale'] && event['scale'] !== 1) { event.preventDefault(); }
}, { passive: false });

// let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  if (event['scale'] && event['scale'] !== 1) { event.preventDefault(); }
  // const now = Date.now();
  // if (now - lastTouchEnd <= 300) {
  //   event.preventDefault();
  // }
  // lastTouchEnd = now;
}, false);


const app = new App({
  target: document.getElementById('app'),
})

export default app
