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
                className={"disabled"}
                title={"Disabled due to bad performance"}
            >
                {isControlMode ? 'Exit Control' : 'Take Control'}
            </button>
        </div>
    );
};
// END SECTION HTML
export default Conning;

/* OLD button, to use in final product:
<button
    className={`control-mode-button ${isControlMode ? 'active' : ''}`}
    onClick={() => setIsControlMode(!isControlMode)}
>
    {isControlMode ? 'Exit Control' : 'Take Control'}
</button>
*/