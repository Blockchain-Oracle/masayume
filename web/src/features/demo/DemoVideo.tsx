import transcript from "./transcript.json";

const VIDEO = "/video/masayume-demo-2026-09-07";

/** Dated real captures, with native controls and a text alternative at every viewport size. */
export function DemoVideo() {
  return (
    <figure className="demo-video-figure">
      <video
        className="demo-video"
        width={1920}
        height={1080}
        controls
        playsInline
        preload="metadata"
        poster={`${VIDEO}.jpg`}
        aria-label="Masayume: a 2 minute 46 second Shannon testnet walkthrough"
        aria-describedby="demo-video-caption"
      >
        <source src={`${VIDEO}.mp4`} type="video/mp4" />
        <track src={`${VIDEO}.vtt`} kind="captions" srcLang="en" label="English" />
        Your browser cannot play this video. <a href={`${VIDEO}.mp4`}>Open the MP4</a> or read the transcript below.
      </video>
      <figcaption id="demo-video-caption" className="demo-video-caption">
        <span>Recorded 6–7 September 2026 · Shannon testnet · Captions included</span>
        <a href={`${VIDEO}.mp4`}>Open video</a>
        <a href={`${VIDEO}.vtt`} download>Download captions</a>
      </figcaption>
      <details className="demo-transcript">
        <summary>Read the transcript</summary>
        {transcript.map((scene) => <p key={scene.id}>{scene.text}</p>)}
      </details>
    </figure>
  );
}
