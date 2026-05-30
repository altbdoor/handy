import { useEffect, useState, type SubmitEventHandler } from "react";
import { FORM_ID } from "./constants";
import type { ComposeOptions } from "./model";

interface PreviewProps {
  onCompose: (opts: ComposeOptions) => Promise<Blob | undefined>;
}

const FACTORS = [1, 2, 3, 4];
const ROTATIONS = [0, 90, 180, 270];

export function Preview(props: PreviewProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [size, setSize] = useState("");
  const [dim, setDim] = useState("");
  const [duration, setDuration] = useState(0);

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
    const opts: ComposeOptions = {
      durations: (fd.getAll("duration") as string[]).map(Number.parseFloat),
      renderSize: parseInt(fd.get("renderSize") as string, 10),
      rotation: parseInt(fd.get("rotation") as string, 10),
      useFfmpeg: (fd.get("useFfmpeg") as string) === "yes",
    };
    setIsLoading(true);

    try {
      const blob = await props.onCompose(opts);

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
      <form id={FORM_ID} onSubmit={handleSubmit}>
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
                defaultChecked={val === 1}
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
              defaultChecked={false}
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
              defaultChecked={true}
              id="useFfmpegNo"
              value="no"
            />
            <label className="form-check-label" htmlFor="useFfmpegNo">
              No
            </label>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Compose video"}
          </button>
          <button
            type="reset"
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Reset
          </button>
        </div>
      </form>

      {src ? (
        <div className="text-center pt-2 d-flex flex-column gap-2 align-items-center">
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
            className="img-fluid"
            onLoadedData={(evt) => {
              const { videoWidth, videoHeight } = evt.currentTarget;
              setDim(`${videoWidth}×${videoHeight}`);
              setDuration(evt.currentTarget.duration);
            }}
          />

          <div className="d-flex gap-2 justify-content-center">
            <span className="badge text-bg-primary">{dim}px</span>
            <span className="badge text-bg-primary">{size}MB</span>
            <span className="badge text-bg-primary">{duration}s</span>
            <span className="badge text-bg-secondary">
              <i className="bi bi-wrench"></i> {loadingTime}s
            </span>
          </div>
          <a href={src} download="compiled.mp4" className="btn btn-info">
            <i className="bi bi-floppy"></i> Download video
          </a>
        </div>
      ) : null}
    </div>
  );
}
