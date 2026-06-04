declare module '@svg-maps/india' {
  interface Location {
    id: string;
    name: string;
    path: string;
  }
  interface SvgMap {
    viewBox: string;
    locations: Location[];
    label?: string;
    description?: string;
  }
  const india: SvgMap;
  export default india;
}
