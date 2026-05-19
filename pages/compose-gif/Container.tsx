import { useState, type ChangeEventHandler } from "react-compat";
import { getFrameDataFromFile, getVideoFromFrameData } from "./util";

export function Container() {
  const [videoSrc, setVideoSrc] = useState("");

  const handleChange: ChangeEventHandler<HTMLInputElement> = async (evt) => {
    const file = Array.from(evt.currentTarget.files ?? []).at(0);
    if (!file) {
      return;
    }

    const frameData = await getFrameDataFromFile(file);
    const videoBlob = await getVideoFromFrameData([frameData]);
    const url = URL.createObjectURL(videoBlob);
    setVideoSrc(url);
  };

  return (
    <div>
      <p>gif to mp4</p>
      <p>
        <input type="file" accept="image/gif" onChange={handleChange} />
      </p>
      <p>
        <video src={videoSrc} loop muted controls></video>
      </p>
    </div>
  );
}
