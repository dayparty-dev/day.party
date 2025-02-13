interface Window {
  documentPictureInPicture: {
    requestWindow(options: {
      width: number;
      height: number;
      initialAspectRatio: number;
      copyStyleSheets: boolean;
    }): Promise<Window>;
  };
}
