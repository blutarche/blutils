export function BrandMark() {
  return (
    <svg class="brand-mark" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bm-ig" x1="0" y1="0" x2="1" y2="1">
          <stop offset="30%" stop-color="var(--accent)" />
          <stop offset="90%" stop-color="var(--accent-2)" />
        </linearGradient>
        <clipPath id="bm-clip">
          <rect x="1" y="1" width="30" height="30" rx="4" />
        </clipPath>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="4" fill="#0F0F11" />
      <g clip-path="url(#bm-clip)">
        <g transform="translate(-13,2) scale(1.8)" fill="url(#bm-ig)" stroke="none">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />
        </g>
      </g>
      <rect x="1" y="1" width="30" height="30" rx="4" fill="none" stroke="var(--accent)" stroke-width="2" />
    </svg>
  )
}
