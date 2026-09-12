const { withPodfile } = require('expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

// CocoaPods resource bundles keep their podspec's minimum even when the app targets a newer iOS.
module.exports = function withPodDeploymentTarget(config) {
  return withPodfile(config, (config) => {
    config.modResults.contents = mergeContents({
      tag: 'pod-deployment-target',
      src: config.modResults.contents,
      newSrc: `    minimum_target = Gem::Version.new(podfile_properties['ios.deploymentTarget'] || min_ios_version_supported)
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |configuration|
        current_target = configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current_target && Gem::Version.new(current_target) < minimum_target
          configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = minimum_target.to_s
        end
      end
    end`,
      anchor: /post_install do \|installer\|/,
      offset: 1,
      comment: '#',
    }).contents;
    return config;
  });
};
