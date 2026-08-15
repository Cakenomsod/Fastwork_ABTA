import { useState } from "react";
import {
  googleDriveThumbnailUrl,
  googleDriveViewUrl,
} from "../lib/drive-file";

export function DriveFileCard(props: {
  url: string;
  label: string;
}) {
  const thumb = googleDriveThumbnailUrl(props.url);
  const openUrl = googleDriveViewUrl(props.url);
  const [broken, setBroken] = useState(!thumb);

  return (
    <figure className="bo-drive-card">
      {!broken && thumb ? (
        <a href={openUrl} target="_blank" rel="noreferrer">
          <img
            src={thumb}
            alt={props.label}
            onError={() => setBroken(true)}
          />
        </a>
      ) : (
        <a
          className="bo-drive-card__fallback"
          href={openUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span className="bo-drive-card__icon" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </span>
          <span>
            <strong>{props.label}</strong>
            <small>เปิดใน Google Drive</small>
          </span>
        </a>
      )}
      <figcaption>
        <a href={openUrl} target="_blank" rel="noreferrer">
          เปิดไฟล์ต้นฉบับ
        </a>
      </figcaption>
    </figure>
  );
}

export default DriveFileCard;
