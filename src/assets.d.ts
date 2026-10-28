// Remotion 的 webpack 把这些文件当作静态资源打包，import 得到的是 URL
declare module '*.wav' {
  const src: string;
  export default src;
}
