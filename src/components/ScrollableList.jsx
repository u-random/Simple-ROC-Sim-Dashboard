import PropTypes from 'prop-types';

const ScrollableList = ({ items, onItemClick, className = '' }) => {
    return (
        <div className={`list ${className}`}>
            {items.map((item) => (
                <button
                    key={item}
                    className="list-item"
                    onClick={() => onItemClick?.(item)}
                >
                    {item}
                </button>
            ))}
        </div>
    );
};

ScrollableList.propTypes = {
    items: PropTypes.arrayOf(PropTypes.string).isRequired,
    onItemClick: PropTypes.func,
    className: PropTypes.string
};

export default ScrollableList;