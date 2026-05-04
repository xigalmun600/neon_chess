export type Game = {
	opponent: string;
	timeControl: string;
	result: "win" | "loss" | "draw";
	accuracy?: number;
};
