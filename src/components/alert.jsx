import PropTypes from 'prop-types';

const Alert = ({ className, ...props }) => (
    <div className={`relative w-full rounded-lg border p-6 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${className}`} {...props} />
);

const AlertDescription = ({ className, ...props }) => (
    <div className={`text-sm [&_p]:leading-relaxed ${className}`} {...props} />
);

Alert.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node
};

AlertDescription.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node
};

export { Alert, AlertDescription };