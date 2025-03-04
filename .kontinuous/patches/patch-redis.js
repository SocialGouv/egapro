module.exports = async (manifests, _options, context) => {
  for (const manifest of manifests) {
    if(manifest.kind==="StatefulSet" && manifest.metadata?.labels?.["app.kubernetes.io/name"] === "redis"){
      if(!manifest.metadata.annotations){
        manifest.metadata.annotations = {}
      }
      manifest.metadata.annotations["kontinuous/plugin.forceRestart"] = "false"
    }
  }
}
