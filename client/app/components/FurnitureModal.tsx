"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";

type Edge = "width" | "height" | "depth";

interface Props {
  image: string;
  dimensions: { width: number; height: number; depth: number };
}

export const FurnitureModal = ({ image, dimensions }: Props) => {
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Image
          src={image}
          alt="Furniture"
          width={400}
          height={400}
          className="rounded-lg cursor-pointer object-cover"
        />
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <div className="relative group">
          <Image
            src={image}
            alt="Furniture"
            width={500}
            height={500}
            className="rounded-xl object-cover"
          />
          {(["width", "height", "depth"] as Edge[]).map((edge) => (
            <div
              key={edge}
              onMouseEnter={() => setHoverEdge(edge)}
              onMouseLeave={() => setHoverEdge(null)}
              className={`absolute ${
                edge === "width" ? "bottom-0 left-1/2" :
                edge === "height" ? "left-0 top-1/2" : "right-0 top-1/2"
              } text-white bg-black/60 px-2 py-1 text-sm rounded transition-all`}
            >
              {hoverEdge === edge && `${edge}: ${dimensions[edge]} cm`}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
