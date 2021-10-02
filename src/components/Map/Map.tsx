import { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { debounce } from "lodash";
import { select, geoMercator } from "d3";
import { Delaunay } from "d3-delaunay";
import { spotData } from "./utils/data/spotData";
import { spotDataTopo } from "./utils/data/spotDataTopo";
import { feature } from "topojson-client";
import randomColor from "randomcolor";

const points = spotData.map((spot) => [spot.lon, spot.lat]);
const padding = 0;
const countries = Array.from(new Set(spotData.map((spot) => spot.country)));
const colors = ["blue", "purple", "pink", "red"];

const countryColors: { [key: string]: string } = {};
countries.forEach(
  (country) =>
    (countryColors[country] = colors[Math.floor(Math.random() * colors.length)])
);

export const Map = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const handleWindowResize = debounce((current: HTMLDivElement) => {
    setWidth(current.offsetWidth);
    setHeight(current.offsetHeight);
  }, 100);

  useEffect(() => {
    const { current } = parentRef;
    if (current) {
      handleWindowResize(current);
      const setResize = () => handleWindowResize(current);
      window.addEventListener("resize", setResize);
      return () => window.removeEventListener("resize", setResize);
    }
  }, [parentRef, handleWindowResize]);

  useEffect(() => {
    const drawMap = () => {
      const projection = geoMercator().fitExtent(
        [
          [padding, padding],
          [width - padding, height - padding],
        ],
        feature(
          spotDataTopo as any,
          spotDataTopo.objects.convertcsv as any
        ) as any
      );
      const pointsFinal = points.map((point) =>
        projection(point as [number, number])
      );
      const delaunay = Delaunay.from(pointsFinal as any);

      const voronoi = delaunay.voronoi([0, 0, width, height]);

      const voronoiGroup = select("#voronoi");

      voronoiGroup
        .selectAll("path")
        .data(spotData)
        .join("path")
        .attr("d", (d: any, i) => voronoi.renderCell(i))
        .style("fill", (d: any, i) =>
          randomColor({
            luminosity: "bright",
            hue: countryColors[d.country],
          })
        )
        // .style("opacity", (d, i) => Math.random())
        .style("stroke", "white")
        .style("stroke-opacity", 0.2);

      const pointsGroup = select("#points");
      pointsGroup
        .selectAll("circle")
        .data(pointsFinal)
        .join("circle")
        .attr("r", 0.9)
        .attr("fill", "white")
        .attr("cx", (d: any) => d[0])
        .attr("cy", (d: any) => d[1]);
    };
    drawMap();
  }, [width, height]);

  return (
    <>
      <div
        className={classNames("relative w-screen h-96 md:h-screen")}
        ref={parentRef}
      >
        <svg width="100%" height="100%" id="map-svg">
          <g id="voronoi"></g>
          <g id="points"></g>
        </svg>
      </div>
    </>
  );
};
