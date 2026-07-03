function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

interface YouTubeEmbedProps {
  url: string;
  title?: string;
}

const YouTubeEmbed = ({ url, title = "Video" }: YouTubeEmbedProps) => {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  // Request a clean, high-quality embed: rel=0 keeps related videos limited to
  // this channel, modestbranding trims YouTube chrome, and playsinline avoids
  // forced fullscreen on mobile. The aspect-video wrapper gives YouTube a large
  // player so it can serve the best resolution the connection allows.
  // Note: actual playback quality is bounded by the uploaded source — YouTube
  // adapts to the original upload resolution + bandwidth and cannot exceed the
  // quality of the video that was uploaded.
  const embedParams = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden shadow-[var(--shadow-lg)]">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?${embedParams.toString()}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
};

export default YouTubeEmbed;
