import { useId } from 'react'

/** Keep the project's original vehicle pixels; the SVG mask removes the field background. */
export function ProjectRoverMarker() {
  const clipId = useId().replaceAll(':', '')
  return <svg className="project-rover-marker" x="-29" y="-64" width="58" height="72" viewBox="380 0 500 620" overflow="visible" aria-label="惠农项目巡检小车">
    <defs><clipPath id={clipId}><path d="M707 28 Q710 2 733 2 Q760 3 760 30 L758 78 Q753 95 743 100 L748 395 L823 400 L855 439 L860 482 Q874 521 847 539 L801 543 Q799 582 774 600 L684 612 L629 600 L608 573 L517 545 Q499 586 461 590 Q410 591 399 547 L397 502 Q399 472 419 456 L433 441 L433 424 L460 413 L458 140 L468 128 L536 111 L536 101 L544 90 L561 88 L571 100 L570 112 L650 108 L718 122 L718 100 Q701 85 704 63 Z"/></clipPath></defs>
    <image href="./media/glass/rover-real.jpg" width="1280" height="600" preserveAspectRatio="none" clipPath={'url(#'+clipId+')'}/>
  </svg>
}
