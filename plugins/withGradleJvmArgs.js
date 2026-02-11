const { withGradleProperties } = require('expo/config-plugins');

const withGradleJvmArgs = (config) => {
    return withGradleProperties(config, (config) => {
        const jvmArgs = config.modResults.find((item) => item.key === 'org.gradle.jvmargs');
        if (jvmArgs) {
            jvmArgs.value = '-Xmx4096m -XX:MaxMetaspaceSize=512m';
        } else {
            config.modResults.push({
                type: 'property',
                key: 'org.gradle.jvmargs',
                value: '-Xmx4096m -XX:MaxMetaspaceSize=512m',
            });
        }
        return config;
    });
};

module.exports = withGradleJvmArgs;
