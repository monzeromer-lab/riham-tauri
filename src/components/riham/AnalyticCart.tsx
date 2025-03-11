interface AnalyticCartProps {
    color: string;
    name: string;
    value: number | string;
}
export default function AnalyticCart(props: AnalyticCartProps) {
    return (
        <div className="m-2 flex flex-row h-24 p-1 pl-0 rounded-md w-40 border border-white">
           <div className={`w-2 h-full rounded-2xl ml-1 `} style={{ backgroundColor: props.color }}></div>
           <div className="flex flex-col w-full h-full ml-2 justify-center">
            <h2 className="text-white font-medium ">{props.name}</h2>
            <span className="text-white text-3xl">{props.value}</span>
           </div>
        </div>
    );
}