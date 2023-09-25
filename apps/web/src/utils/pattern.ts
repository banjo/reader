import GeoPattern from "geopattern";

export const getPattern = (value: string) => {
    return GeoPattern.generate(value).toDataUrl();
};
