export type Game = {
	id?: number;
	opponent: string;
	timeControl: string;
	result: "win" | "loss" | "draw";
	accuracy?: number;
};
