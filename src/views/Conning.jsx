import ConningInfo from "../components/ConningInfo.jsx";


const Conning = ({ isControlMode, setIsControlMode }) => {

    // SECTION HTML
    return (
        <div className="container-25">
            <div className="list-header">CONNING</div>
            <div className="list">
                <ConningInfo/>
            </div>
            <button
                className={`control-mode-button ${isControlMode ? 'active' : ''}`}
                onClick={() => setIsControlMode(!isControlMode)}
            >
                {isControlMode ? 'Exit Control' : 'Take Control'}
            </button>
        </div>
    );
};
// END SECTION HTML
export default Conning;