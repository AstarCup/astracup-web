import ComplexWave from "../effect/ComplexWave";

const MainCard = ({children}:{children: React.ReactNode}) => {
    return(
        <div className="max-w-5xl mx-auto mt-60 bg-white p-4 " >
            <ComplexWave ></ComplexWave>
            {children}
        </div>
    )
}

export default MainCard;