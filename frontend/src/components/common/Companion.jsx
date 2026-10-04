import { useId } from "react";
export default function Companion({ className = "", decorative = false }) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className={`companion ${className}`}
      viewBox="0 0 400 400"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={
        decorative
          ? undefined
          : "Milo, the Study Mind companion: a friendly little book with a bright pink bookmark"
      }
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#EEEEEE" />
          <stop offset=".55" stopColor="#EEEEEE" />
          <stop offset="1" stopColor="#DDDDDD" />
        </linearGradient>
        <linearGradient id={`${id}-pink`} x1="0" x2="1" y2="1">
          <stop stopColor="#CB2957" />
          <stop offset="1" stopColor="#CB2957" stopOpacity=".65" />
        </linearGradient>
        <filter
          id={`${id}-shadow`}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <ellipse
        cx="207"
        cy="348"
        rx="93"
        ry="13"
        fill="#000"
        opacity=".09"
        filter={`url(#${id}-shadow)`}
      />
      <path
        d="M126 224q-56-21-56 21t55 35"
        fill={`url(#${id}-body)`}
        stroke="#000"
        strokeOpacity=".08"
      />
      <path
        d="M279 214q59-40 54-3t-50 66"
        fill={`url(#${id}-body)`}
        stroke="#000"
        strokeOpacity=".08"
      />
      <rect
        x="143"
        y="313"
        width="40"
        height="24"
        rx="11"
        fill="#000"
        opacity=".8"
      />
      <rect
        x="231"
        y="313"
        width="40"
        height="24"
        rx="11"
        fill="#000"
        opacity=".8"
      />
      <path
        d="M118 120Q119 94 148 98L274 116Q293 120 293 148V298Q293 330 263 327L141 310Q118 305 118 281Z"
        fill={`url(#${id}-pink)`}
      />
      <path
        d="M130 116Q130 99 151 104L263 119Q282 121 282 143V292Q282 314 261 313L148 299Q130 297 130 277Z"
        fill="#DDDDDD"
      />
      <path
        d="M140 117l120 17m-119-9 119 16m-119-8 119 16"
        fill="none"
        stroke="#000"
        strokeOpacity=".11"
        strokeWidth="2"
      />
      <path
        d="M131 133Q131 112 156 116L275 133Q300 137 299 165L296 299Q296 323 271 321L151 306Q129 302 130 280Z"
        fill={`url(#${id}-body)`}
        stroke="#000"
        strokeOpacity=".06"
      />
      <path d="M245 121v57l16-11 13 14v-56" fill="#CB2957" />
      <rect
        x="147"
        y="168"
        width="133"
        height="82"
        rx="30"
        transform="rotate(6 210 208)"
        fill="#000"
      />
      <rect
        x="168"
        y="193"
        width="24"
        height="24"
        rx="10"
        transform="rotate(6 180 205)"
        fill="#CB2957"
      />
      <rect
        x="234"
        y="199"
        width="24"
        height="24"
        rx="10"
        transform="rotate(6 246 211)"
        fill="#CB2957"
      />
      <path
        d="M204 223q8 8 16 1"
        fill="none"
        stroke="#EEEEEE"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M198 267q8-4 15 2 8-4 15 2v18q-8-5-15-1-8-6-15-3Z"
        fill="none"
        stroke="#CB2957"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M213 269v19" stroke="#CB2957" strokeWidth="3" />
    </svg>
  );
}
