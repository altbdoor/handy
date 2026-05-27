import { useEffect, useState, type SubmitEventHandler } from "react";

interface PreviewProps {
  formId: string;
  onCompose: (fd: FormData) => Promise<Blob | undefined>;
}

const FACTORS = [1, 2, 3, 4];
const ROTATIONS = [0, 90, 180, 270];
const isFirefoxWindows = /Windows.+Firefox/.test(navigator.userAgent);

export function Preview(props: PreviewProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [size, setSize] = useState("");
  const [dim, setDim] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTime, setLoadingTime] = useState("");

  useEffect(() => {
    return () => {
      if (src) {
        URL.revokeObjectURL(src);
      }
    };
  }, [src]);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (evt) => {
    evt.preventDefault();
    const startTime = Date.now();

    if (src) {
      URL.revokeObjectURL(src);
    }

    setSrc(null);
    setSize("");
    setDim("");

    const fd = new FormData(evt.currentTarget);
    setIsLoading(true);

    try {
      const blob = await props.onCompose(fd);

      if (blob) {
        setSrc(URL.createObjectURL(blob));
        setSize((blob.size / 1024 / 1024).toFixed(2));
      }
    } catch (err) {
      console.error(err);
      alert(err);
    } finally {
      setIsLoading(false);
      setLoadingTime(((Date.now() - startTime) / 1000).toFixed(2));
    }
  };

  return (
    <div>
      <form id={props.formId} onSubmit={handleSubmit}>
        <hr />

        <div className="pb-3">
          <div className="form-label">Render size:</div>
          {FACTORS.map((val) => (
            <div className="form-check form-check-inline" key={val}>
              <input
                className="form-check-input"
                type="radio"
                name="renderSize"
                id={`renderSize${val}`}
                defaultChecked={val === 2}
                value={val}
              />
              <label className="form-check-label" htmlFor={`renderSize${val}`}>
                {val}x
              </label>
            </div>
          ))}
        </div>

        <div className="pb-3">
          <div className="form-label">Rotation:</div>
          {ROTATIONS.map((val) => (
            <div className="form-check form-check-inline" key={val}>
              <input
                className="form-check-input"
                type="radio"
                name="rotation"
                id={`rotation${val}`}
                defaultChecked={val === 0}
                value={val}
              />
              <label className="form-check-label" htmlFor={`rotation${val}`}>
                {val}deg
              </label>
            </div>
          ))}
        </div>

        <div className="pb-3">
          <div className="form-label">Lossless reencode with FFmpeg:</div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="useFfmpeg"
              defaultChecked={isFirefoxWindows}
              id="useFfmpegYes"
              value="yes"
            />
            <label className="form-check-label" htmlFor="useFfmpegYes">
              Yes
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="useFfmpeg"
              defaultChecked={!isFirefoxWindows}
              id="useFfmpegNo"
              value="no"
            />
            <label className="form-check-label" htmlFor="useFfmpegNo">
              No
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Compose video"}
        </button>
      </form>

      {src ? (
        <div className="text-center">
          <video
            key={src}
            src={src}
            autoPlay
            loop
            muted
            controls
            playsInline
            disablePictureInPicture
            controlsList="nofullscreen noremoteplayback"
            className="img-fluid pt-2"
            onLoadedData={(evt) => {
              const { videoWidth, videoHeight } = evt.currentTarget;
              setDim(`${videoWidth}×${videoHeight}`);
            }}
          />

          <div className="py-2">
            {dim}px @ {size}MB, took {loadingTime}s
          </div>
          <a href={src} download="compiled.mp4" className="btn btn-info">
            <i className="bi bi-floppy"></i> Download video
          </a>
        </div>
      ) : null}
    </div>
  );
}
