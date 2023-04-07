declare module "react-piwik" {
  export default interface ReactPiwik {
    /**
     * @method
     * @description Connect router history to Piwik
     * @param {History} history History object from the history package
     */
    connectToHistory<H extends LooseHistory>(history: H, trackAtConnect: boolean): H
  }
}

export {}
