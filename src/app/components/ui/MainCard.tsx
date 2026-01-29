import Image from "next/image";

const MainCard = ({children}:{children: React.ReactNode}) => {
    return(
        <div className="relative max-w-5xl mx-auto mt-60 bg-white p-4 rounded-lg" >
            <div className="absolute lg:-top-20 md:-top-22 right-10 w-full flex justify-end items-right">
                <Image src={"/MainCardTop.svg"} width={600} height={240} alt="" />
            </div>
            {children}
        </div>
    )
}

export default MainCard;